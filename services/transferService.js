import { getDatabase, ref, set, get } from 'firebase/database';

export class TransferService {
    static async addTransfer(transfer) {
        const db = getDatabase();
        const transferRef = ref(db, `transferredStudents/${transfer.studentId}`);
        await set(transferRef, {
            ...transfer,
            createdAt: new Date().toISOString(),
            status: transfer.status || 'Pending'
        });
    }

    static async getTransfers() {
        const db = getDatabase();
        const transfersRef = ref(db, 'transferredStudents');
        const snapshot = await get(transfersRef);
        return snapshot.val() || {};
    }

    static async updateTransfer(studentId, updates) {
        const db = getDatabase();
        const transferRef = ref(db, `transferredStudents/${studentId}`);
        await set(transferRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    }

    static async deleteTransfer(studentId) {
        const db = getDatabase();
        const transferRef = ref(db, `transferredStudents/${studentId}`);
        await set(transferRef, null);
    }
}
