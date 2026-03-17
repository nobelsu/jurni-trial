import { useState, useEffect, useCallback } from "react";

/** Accept any navigation object that has addListener and dispatch (React Navigation / Expo Router). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigationLike = any;

export interface UseUnsavedChangesGuardOptions {
  isDirty: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  /** When true, do not block navigation (e.g. while save is in progress). */
  allowLeave?: boolean;
}

export interface UseUnsavedChangesGuardResult {
  showUnsavedModal: boolean;
  handleSave: () => Promise<void>;
  handleDiscard: () => void;
  saving: boolean;
  handleCancel: () => void;
}

export function useUnsavedChangesGuard(
  navigation: NavigationLike,
  options: UseUnsavedChangesGuardOptions
): UseUnsavedChangesGuardResult {
  const { isDirty, onSave, onDiscard, allowLeave = false } = options;
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!navigation) return;

    const unsubscribe = (navigation as { addListener: (ev: string, cb: (e: { data: { action: unknown }; preventDefault: () => void }) => () => void) => () => void }).addListener(
      "beforeRemove",
      (e: { data: { action: unknown }; preventDefault: () => void }) => {
        if (!isDirty || allowLeave) return () => {};
        e.preventDefault();
        setPendingAction(e.data.action);
        setShowUnsavedModal(true);
        return () => {};
      }
    );

    return unsubscribe;
  }, [navigation, isDirty, allowLeave]);

  const handleSave = useCallback(async () => {
    if (!pendingAction) return;
    setSaving(true);
    try {
      await onSave();
      navigation.dispatch(pendingAction);
      setShowUnsavedModal(false);
      setPendingAction(null);
    } finally {
      setSaving(false);
    }
  }, [navigation, onSave, pendingAction]);

  const handleDiscard = useCallback(() => {
    if (!pendingAction) return;
    onDiscard();
    navigation.dispatch(pendingAction);
    setShowUnsavedModal(false);
    setPendingAction(null);
  }, [onDiscard, pendingAction, navigation]);

  const handleCancel = useCallback(() => {
    setShowUnsavedModal(false);
    setPendingAction(null);
  }, []);

  return {
    showUnsavedModal,
    handleSave,
    handleDiscard,
    saving,
    handleCancel,
  };
}
