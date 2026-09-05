// ============================================================
// SPE — Sovereign Payroll Engine (محرك الرواتب السيادي)
// حساب الرواتب الداخلي بدون ربط GOSI/WPS حكومي
// ============================================================
import { SovereignEngine, EngineResult, EngineContext, generateC9Hash } from "./types";

export const payrollEngine: SovereignEngine = {
  id: "SPE-2026",
  name: "Sovereign Payroll Engine",
  version: "2026.1.0",

  async execute(payload: any, ctx: EngineContext): Promise<EngineResult> {
    const ts = new Date().toISOString();
    try {
      const { employees, month, year } = payload;
      if (!Array.isArray(employees) || employees.length === 0) {
        return { success: false, error: "قائمة الموظفين فارغة", timestamp: ts, engineId: this.id };
      }

      const calculations = employees.map((emp: any) => {
        const baseSalary = Number(emp.baseSalary) || 0;
        const isSaudi = emp.nationality === "سعودي" || emp.nationality === "Saudi";
        const gosiRate = isSaudi ? 0.0975 : 0.02;
        const gosiAmount = Math.min(baseSalary, 45000) * gosiRate;
        const absenceDays = Number(emp.absenceDays) || 0;
        const absenceDeduction = absenceDays > 0 ? (baseSalary / 30) * absenceDays : 0;
        const netSalary = baseSalary - gosiAmount - absenceDeduction;

        return {
          employeeId: emp.id,
          name: emp.name,
          baseSalary,
          gosiRate: `${(gosiRate * 100).toFixed(2)}%`,
          gosiAmount: Number(gosiAmount.toFixed(2)),
          absenceDays,
          absenceDeduction: Number(absenceDeduction.toFixed(2)),
          netSalary: Number(netSalary.toFixed(2)),
          month,
          year,
        };
      });

      const totalPayroll = calculations.reduce((sum: number, c: any) => sum + c.netSalary, 0);
      const result = { calculations, totalPayroll, month, year, entityId: ctx.entityId };

      return {
        success: true,
        data: result,
        timestamp: ts,
        engineId: this.id,
        c9Hash: generateC9Hash(this.id, result, ts),
      };
    } catch (err: any) {
      return { success: false, error: err.message, timestamp: ts, engineId: this.id };
    }
  },

  async healthCheck() {
    return { status: "healthy", details: "SPE جاهز لحساب الرواتب الداخلية" };
  },
};
