import { rideTypeMetadata } from "../constants/MockData"

export interface RideTypeData {
  name: string 
  passengers: number 
  tags: number[]
  time: number
  baseFare: number
  costPerKm: number
  costPerMinute: number
  minimumFare: number
  surgeMultiplier: number
}

export type RideTypeId = "basic" | "plus" | "exec" | "xl" | "access"
export type RideTypeDict = Partial<Record<RideTypeId, RideTypeData>>

export function calculateRideCost(
  metadata: RideTypeData,
  distanceKm: number,
  durationMinutes: number
): number {
  
  if (distanceKm < 0 || durationMinutes < 0) {
    throw new Error("Distance and duration must be non-negative")
  }

  const {
    baseFare,
    costPerKm,
    costPerMinute,
    minimumFare,
    surgeMultiplier
  } = metadata

  let total =
    baseFare +
    (distanceKm * costPerKm) +
    (durationMinutes * costPerMinute)

  total *= surgeMultiplier

  if (total < minimumFare) {
    total = minimumFare
  }

  return Math.round(total * 100) / 100
}

export function calculateRideCostByType(
  rideTypeId: RideTypeId,
  distanceKm: number,
  durationMinutes: number
): number {

  const rideType = rideTypeMetadata[rideTypeId]

  if (!rideType) {
    throw new Error("Invalid ride type")
  }

  return calculateRideCost(rideType, distanceKm, durationMinutes)
}

export function calculatePickupTime(
  metadata: RideTypeData
): string {

  if (metadata.time < 0) {
    throw new Error("Pickup time must be non-negative")
  }

  const pickupDate = new Date(Date.now() + metadata.time * 60_000)

  const hours = pickupDate.getHours().toString().padStart(2, "0")
  const minutes = pickupDate.getMinutes().toString().padStart(2, "0")

  return `${hours}.${minutes}`
}

export function calculatePickupTimeByType(
  rideTypeId: RideTypeId
): string {

  const rideType = rideTypeMetadata[rideTypeId]

  if (!rideType) {
    throw new Error("Invalid ride type")
  }

  return calculatePickupTime(rideType)
}