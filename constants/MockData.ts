import { RideTypeDict, } from "../lib/cost";

export const pickupData = [
    { "id": "P1", "location": "Warehouse Alpha", "address": "123 Industrial Park Rd, Springfield" },
    { "id": "P2", "location": "North Loading Bay", "address": "48 Maple Street, Riverside" },
    { "id": "P3", "location": "South Depot", "address": "900 Logistics Ave, Hillview" },
    { "id": "P4", "location": "East Storage Facility", "address": "221 Eastline Dr, Brookfield" },
];

export const destinationData = [
    { "id": "D1", "location": "Retail Store Central", "address": "501 Commerce Blvd, Lakewood", "distance": "1.4 mi"},
    { "id": "D2", "location": "Customer Dropoff Zone A", "address": "77 Oakridge Lane, Meadowview", "distance": "2.1 mi"},
    { "id": "D3", "location": "Regional Distribution Center", "address": "200 Transit Way, Pinecrest", "distance": "1.6 mi"},
    { "id": "D4", "location": "Express Delivery Point", "address": "5 Sunrise Drive, Fairmont", "distance": "32 mi"},
];

export const rideTypeMetadata: RideTypeDict = {
    "basic": {
        name: "Jurni Go",
        passengers: 4, 
        tags: [0],
        time: 3,
        baseFare: 2.00,
        costPerKm: 0.50,
        costPerMinute: 0.20,
        minimumFare: 3.00,
        surgeMultiplier: 1.0,
    },
    "plus": {
        name: "Jurni Plus",
        passengers: 4,
        tags: [1],
        time: 4,
        baseFare: 3.00,
        costPerKm: 0.50,
        costPerMinute: 0.20,
        minimumFare: 3.00,
        surgeMultiplier: 1.0,
    },
    "exec": {
        name: "Jurni Executive",
        passengers: 2,
        tags: [2],
        time: 4,
        baseFare: 3.00,
        costPerKm: 0.50,
        costPerMinute: 0.20,
        minimumFare: 3.00,
        surgeMultiplier: 1.0,
    },
    "xl": {
        name: "Jurni XL",
        passengers: 6,
        tags: [3],
        time: 4,
        baseFare: 3.00,
        costPerKm: 0.50,
        costPerMinute: 0.20,
        minimumFare: 3.00,
        surgeMultiplier: 1.0,
    },
    "access": {
        name: "Jurni Access",
        passengers: 4,
        tags: [4],
        time: 4,
        baseFare: 3.00,
        costPerKm: 0.50,
        costPerMinute: 0.20,
        minimumFare: 3.00,
        surgeMultiplier: 1.0,
    },
};

export const rideSummaryData = [
    {"name": "Price", "value": "£3.00"},
    {"name": "Date", "value": "December 11, 2025"},
    {"name": "Pickup", "value": "123 Industrial Park Rd, Springfield"},
    {"name": "Destination", "value": "77 Oakridge Lane, Meadowview"},
    {"name": "Ride", "value": "JurniX"},
]