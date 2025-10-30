import { DocumentData } from "firebase/firestore";

export type RepairStatus =
  | "in_review"
  | "repairing"
  | "waiting_parts"
  | "done"
  | "not_repaired"
  | "delivered";

export type RepairPiece = {
  id: string;
  inventoryId: string | null;
  name: string;
  quantity: number;
  unitCost: number;
  addedAt: Date;
};

export type Repair = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deviceModel: string;
  imei: string | null;
  issueDescription: string;
  checklist: Record<string, boolean>;
  status: RepairStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedTo: string;
  estimatedCost: number;
  finalCost: number;
  deliveryDate: Date | null;
  folio: string | null;
  notes?: string;
  signature?: string | null;
  deliverySignature?: string | null; // ✅ nuevo campo

  pieces: RepairPiece[];
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Repair = {
  fromFirestore: (doc: DocumentData): Repair => {
    const data = doc.data();
    return {
      id: doc.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      deviceModel: data.deviceModel,
      imei: data.imei || null,
      issueDescription: data.issueDescription,
      checklist: data.checklist || {},
      status: data.status,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      assignedTo: data.assignedTo,
      estimatedCost: data.estimatedCost,
      finalCost: data.finalCost,
      deliveryDate: data.deliveryDate ? data.deliveryDate.toDate() : null,
      folio: data.folio || null,
      notes: data.notes ?? "",
      signature: data.signature || null,
      deliverySignature: data.deliverySignature || null, // ✅ nuevo campo

      pieces:
        data.pieces?.map((piece: any) => ({
          id: piece.id,
          inventoryId: piece.inventoryId || null,
          name: piece.name,
          quantity: piece.quantity,
          unitCost: piece.unitCost,
          addedAt: piece.addedAt.toDate(),
        })) || [],
    };
  },

  toFirestore: (repair: Omit<Repair, "id">): DocumentData => {
    return {
      customerName: repair.customerName,
      customerEmail: repair.customerEmail,
      customerPhone: repair.customerPhone,
      deviceModel: repair.deviceModel,
      imei: repair.imei || null,
      issueDescription: repair.issueDescription,
      checklist: repair.checklist || {},
      status: repair.status,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt,
      assignedTo: repair.assignedTo,
      estimatedCost: repair.estimatedCost,
      finalCost: repair.finalCost,
      deliveryDate: repair.deliveryDate,
      folio: repair.folio,
      notes: repair.notes ?? "",
      signature: repair.signature || null,
      deliverySignature: repair.deliverySignature || null, // ✅ nuevo campo

      pieces: repair.pieces.map((piece) => ({
        id: piece.id,
        inventoryId: piece.inventoryId,
        name: piece.name,
        quantity: piece.quantity,
        unitCost: piece.unitCost,
        addedAt: piece.addedAt,
      })),
    };
  },
};
