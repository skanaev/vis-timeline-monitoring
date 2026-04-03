import { useMemo, useState } from 'react';
import type { SelectedItemState } from '../../shared/types/timeline';

interface UseSelectedItemResult {
  selectedItem: SelectedItemState | null;
  openDetailsModal: (item: SelectedItemState) => void;
  closeDetailsModal: () => void;
  isSelected: (item: SelectedItemState) => boolean;
}

export const useSelectedItem = (
  initialState: SelectedItemState | null = null,
): UseSelectedItemResult => {
  const [selectedItem, setSelectedItem] = useState<SelectedItemState | null>(initialState);

  return useMemo(() => {
    const isSelected = (item: SelectedItemState): boolean => {
      return (
        selectedItem?.entityType === item.entityType && selectedItem.entityId === item.entityId
      );
    };

    return {
      selectedItem,
      openDetailsModal: setSelectedItem,
      closeDetailsModal: () => setSelectedItem(null),
      isSelected,
    };
  }, [selectedItem]);
};
