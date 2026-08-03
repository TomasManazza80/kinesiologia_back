import { AppDataSource } from '../database.js';

function calculatePaymentDates(startDate, endDate, paymentFrequency) {
    if (!startDate || !endDate || !paymentFrequency) {
        return [];
    }
    try {
        const paymentDates = [];
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        while (currentDate <= lastDate) {
            paymentDates.push(new Date(currentDate));
            if (paymentFrequency === "WEEKLY") {
                currentDate.setDate(currentDate.getDate() + 7);
            }
            else if (paymentFrequency === "MONTHLY") {
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            else if (paymentFrequency === "ANNUALLY") {
                currentDate.setFullYear(currentDate.getFullYear() + 1);
            }
            else if (paymentFrequency === "QUARTERLY") {
                currentDate.setMonth(currentDate.getMonth() + 3);
            }
            else {
                return [];
            }
        }
        return paymentDates;
    }
    catch (error) {
        console.log("error calculating payment dates", error);
        return [];
    }
}

export async function createLeaseWithPaymentSchedule(leaseData, userId) {
    let paymentDates = [];
    if (leaseData.status === "ACTIVE") {
        paymentDates = calculatePaymentDates(
            leaseData.startDate,
            leaseData.endDate,
            leaseData.paymentFrequency
        );
    }

    const data = {...leaseData};
    const tenantId = data.tenantId;
    const unitId = data.unitId;
    delete data.tenantId;
    delete data.unitId;

    let lease = null;
    const leaseRepo = AppDataSource.getRepository('Lease');
    const paymentScheduleRepo = AppDataSource.getRepository('LeasePaymentSchedule');
    const realtorRepo = AppDataSource.getRepository('Realtor');

    const realtor = await realtorRepo.findOne({ where: { userId } });

    try {
        lease = leaseRepo.create({
            ...data,
            tenantId,
            unitId,
            realtorId: realtor ? realtor.id : null
        });
        await leaseRepo.save(lease);
    } catch (error) {
        console.log("failed to create lease", error);
        throw error;
    }

    try {
        const schedules = paymentDates.map((date) => paymentScheduleRepo.create({
            dueDate: date,
            amountDue: leaseData.rentalPrice,
            leaseId: lease.id,
        }));
        if (schedules.length > 0) {
            await paymentScheduleRepo.save(schedules);
        }
    } catch (error) {
        console.log("failed to add payment schedules", error);
    }

    const updatedLease = await leaseRepo.findOne({
        where: { id: lease.id },
        relations: { tenant: true, unit: true, paymentSchedule: true },
    });

    return updatedLease;
}
