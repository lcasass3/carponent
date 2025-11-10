import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../services/firebase";
import { Repair, RepairStatus } from "../types/repair.type";

export class RepairsRepository {
  static async getAll(): Promise<Repair[]> {
    const snapshot = await getDocs(
      query(collection(db, "repairs"), orderBy("createdAt", "desc"))
    );
    return snapshot.docs.map(Repair.fromFirestore);
  }

  static async getById(id: string): Promise<Repair | null> {
    const docRef = doc(db, "repairs", id);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return Repair.fromFirestore(snapshot);
    }
    return null;
  }

  static async getByFolio(folio: string): Promise<Repair | null> {
    try {
      const q = query(
        collection(db, "repairs"),
        where("folio", "==", folio.toUpperCase()),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return Repair.fromFirestore(snapshot.docs[0]);
    } catch (error) {
      console.error("Error getting repair by folio:", error);
      throw error;
    }
  }

  static async getByStatus(status: RepairStatus): Promise<Repair[]> {
    const snapshot = await getDocs(
      query(
        collection(db, "repairs"),
        where("status", "==", status),
        orderBy("createdAt", "desc")
      )
    );
    return snapshot.docs.map(Repair.fromFirestore);
  }

  static async getByAssignedTo(userId: string): Promise<Repair[]> {
    const snapshot = await getDocs(
      query(
        collection(db, "repairs"),
        where("assignedTo", "==", userId),
        orderBy("createdAt", "desc")
      )
    );
    return snapshot.docs.map(Repair.fromFirestore);
  }

  static async getRecent(limitCount: number = 10): Promise<Repair[]> {
    const snapshot = await getDocs(
      query(
        collection(db, "repairs"),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      )
    );
    return snapshot.docs.map(Repair.fromFirestore);
  }

  static async create(repair: Omit<Repair, "id">): Promise<string> {
    const docRef = await addDoc(
      collection(db, "repairs"),
      Repair.toFirestore(repair)
    );
    return docRef.id;
  }

  static async update(
    id: string,
    updates: Partial<Omit<Repair, "id">>
  ): Promise<void> {
    const docRef = doc(db, "repairs", id);
    const updateData = { ...updates, updatedAt: new Date() };
    await updateDoc(docRef, updateData);
  }

  static async delete(id: string): Promise<void> {
    const docRef = doc(db, "repairs", id);
    await deleteDoc(docRef);
  }

  static async updateStatus(id: string, status: RepairStatus): Promise<void> {
    await this.update(id, { status });
  }

  static async markAsDelivered(repairId: string): Promise<void> {
    try {
      await this.update(repairId, {
        status: "delivered",
        deliveryDate: new Date(),
      });
    } catch (error) {
      console.error("Error marking repair as delivered:", error);
      throw error;
    }
  }

  static async addNote(
    repairId: string,
    note: { authorId: string; text: string }
  ): Promise<void> {
    const repair = await this.getById(repairId);
    if (!repair) throw new Error("Repair not found");

    const newNote = {
      id: Date.now().toString(), // You might want to use a better ID generation strategy
      authorId: note.authorId,
      text: note.text,
      createdAt: new Date(),
    };

    const updatedNotes = [...repair.notes, newNote];
    await this.update(repairId, { notes: updatedNotes });
  }

  static async addPiece(
    repairId: string,
    piece: {
      inventoryId?: string;
      name: string;
      quantity: number;
      unitCost: number;
    }
  ): Promise<void> {
    const repair = await this.getById(repairId);
    if (!repair) throw new Error("Repair not found");

    const newPiece = {
      id: Date.now().toString(), // You might want to use a better ID generation strategy
      inventoryId: piece.inventoryId || null,
      name: piece.name,
      quantity: piece.quantity,
      unitCost: piece.unitCost,
      addedAt: new Date(),
    };

    const updatedPieces = [...repair.pieces, newPiece];
    await this.update(repairId, { pieces: updatedPieces });
  }
}
