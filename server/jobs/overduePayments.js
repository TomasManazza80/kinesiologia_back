import { AppDataSource } from "../database.js";
import { LessThan } from "typeorm";

export async function checkOverduePayments() {
  const now = new Date();

  try {
    const scheduleRepo = AppDataSource.getRepository('LeasePaymentSchedule');
    
    // Find all payment schedules that are overdue and not already marked as OVERDUE
    const overdueSchedules = await scheduleRepo.find({
      where: {
        dueDate: LessThan(now),
        status: "SCHEDULED"
      }
    });

    // Update each overdue schedule to mark it as OVERDUE
    const updatePromises = overdueSchedules.map(schedule =>
        scheduleRepo.update(schedule.id, {status: 'OVERDUE'})
    );

    await Promise.all(updatePromises);
    console.log(`Marked ${updatePromises?.length} payment schedules as OVERDUE.`);

  } catch (error) {
    console.log("error finding overdue payments", error);
  }
}