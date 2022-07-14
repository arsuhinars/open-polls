export enum ModalButtonType {
  Primary,
  Secondary,
}

export interface ModalButton {
  type: ModalButtonType;
  text: string;
}
