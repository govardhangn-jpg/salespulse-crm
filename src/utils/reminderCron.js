const cron = require('node-cron');
const Interaction = require('../models/Interaction');
const Notification = require('../models/Notification');
const { sendEmail } = require('./email');

/**
 * Runs every minute.
 * Finds interactions whose nextAction.dueDate is within
 * REMINDER_LEAD_MINUTES from now and haven't had a reminder sent.
 */
const startReminderCron = () => {
  const leadMinutes = parseInt(process.env.REMINDER_LEAD_MINUTES) || 15;

  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const windowEnd = new Date(now.getTime() + leadMinutes * 60 * 1000);
      const windowStart = new Date(now.getTime() + (leadMinutes - 1) * 60 * 1000);

      const due = await Interaction.find({
        'nextAction.dueDate': { $gte: windowStart, $lte: windowEnd },
        'nextAction.isCompleted': false,
        'nextAction.reminderSent': false,
      })
        .populate('customer', 'name')
        .populate('nextAction.assignedTo', 'name email');

      for (const interaction of due) {
        const assignee = interaction.nextAction.assignedTo;
        if (!assignee) continue;

        const title = `⏰ Reminder: ${interaction.nextAction.type} — ${interaction.customer?.name}`;
        const message = `Due in ${leadMinutes} minutes at ${new Date(interaction.nextAction.dueDate).toLocaleTimeString()}.`;

        // In-app notification
        await Notification.create({
          recipient: assignee._id,
          type: 'reminder',
          title,
          message,
          refModel: 'Interaction',
          refId: interaction._id,
        });

        // Email notification
        if (assignee.email) {
          await sendEmail({
            to: assignee.email,
            subject: title,
            html: `<p>Hi ${assignee.name},</p><p>${message}</p><p>— SalesPulse CRM</p>`,
          });
        }

        // Mark reminder sent
        await Interaction.findByIdAndUpdate(interaction._id, {
          'nextAction.reminderSent': true,
          'nextAction.reminderSentAt': now,
        });

        console.log(`[REMINDER] Sent to ${assignee.name} for "${interaction.nextAction.type}" at ${interaction.customer?.name}`);
      }
    } catch (err) {
      console.error('[REMINDER CRON ERROR]', err.message);
    }
  });

  console.log(`✅ Reminder cron started (${leadMinutes} min lead time)`);
};

module.exports = { startReminderCron };
