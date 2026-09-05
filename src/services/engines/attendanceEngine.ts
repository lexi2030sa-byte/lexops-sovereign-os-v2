import * as admin from "firebase-admin";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import { SovereignEngine, EngineResult, EngineContext, generateC9Hash } from "./types";

export interface GeoPunchRecord {
  uid: string;
  email: string;
  entityId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  status: string;
}

/**
 * تسجيل حضور جغرافي حقيقي ومباشر في قاعدة بيانات Firestore
 * (الدالة الأصلية — محفوظة للتوافقية العكسية)
 */
export async function recordLiveGeoPunch(data: Omit<GeoPunchRecord, "timestamp" | "status">): Promise<{ id: string; status: string }> {
  const db = getFirestore();
  if (!data.entityId) {
    throw new Error("Sovereign Protocol Violation: Missing entityId for geo-punch registration.");
  }
  const attendanceRef = db.collection("attendance").doc();
  const timestamp = new Date();
  const newRecord: GeoPunchRecord = {
    uid: data.uid,
    email: data.email,
    entityId: data.entityId,
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: timestamp,
    status: "PRESENT"
  };
  await attendanceRef.set({
    ...newRecord,
    timestamp: Timestamp.fromDate(timestamp),
    createdAt: FieldValue.serverTimestamp()
  });
  return { id: attendanceRef.id, status: "SUCCESS" };
}

/**
 * جلب سجلات الحضور الحقيقية للكيان السيادي النشط
 * (الدالة الأصلية — محفوظة للتوافقية العكسية)
 */
export async function getLiveAttendanceRecords(entityId: string, limitCount: number = 50): Promise<any[]> {
  const db = getFirestore();
  if (!entityId) {
    throw new Error("Sovereign Protocol Violation: Query denied due to missing entityId.");
  }
  const snapshot = await db.collection("attendance")
    .where("entityId", "==", entityId)
    .orderBy("timestamp", "desc")
    .limit(limitCount)
    .get();
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: (data.timestamp as Timestamp)?.toDate() || null
    };
  });
}

/**
 * المحرك السيادي الموحد لمطابقة S9 Ledger
 */
export const attendanceEngine: SovereignEngine = {
  id: "SDE-2026",
  name: "Sovereign Attendance Engine",
  version: "2026.1.0",

  async execute(payload: any, ctx: EngineContext): Promise<EngineResult> {
    const ts = new Date().toISOString();
    try {
      const result = await recordLiveGeoPunch({
        uid: ctx.userId,
        email: payload.email || "",
        entityId: ctx.entityId,
        latitude: parseFloat(payload.userLat),
        longitude: parseFloat(payload.userLng)
      });
      return {
        success: true,
        data: result,
        timestamp: ts,
        engineId: this.id,
        c9Hash: generateC9Hash(this.id, payload, ts)
      };
    } catch (err: any) {
      return { success: false, error: err.message, timestamp: ts, engineId: this.id };
    }
  },

  async healthCheck() {
    try {
      const db = getFirestore();
      await db.collection("attendance").limit(1).get();
      return { status: "healthy", details: "SDE متصل بنجاح بقاعدة البيانات وجاهز للتشغيل" };
    } catch (err: any) {
      return { status: "down", details: `SDE معطل: ${err.message}` };
    }
  }
};

export default attendanceEngine;
