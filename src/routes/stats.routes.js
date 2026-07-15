const express = require('express');
const Topic = require('../models/Topic');
const requireAuth = require('../middleware/requireAuth');
const { todayStr } = require('../utils/dates');

const router = express.Router();

router.use(requireAuth); // Protect this route

// Helper to convert Mongoose Dates into strict YYYY-MM-DD local strings
const toLocalYMD = (dateObj) => {
  if (!dateObj) return null;
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

router.get('/stats/summary', async (req, res) => {
  try {
    const today = todayStr();
    const allTopics = await Topic.find({});
    const activeTopics = allTopics.filter(t => t.status === 'active');

    // 1. Total Topics
    const totalTopics = activeTopics.length;

    // 2. Due Today & Most Neglected Subject
    let dueCount = 0;
    const subjectDueCounts = {};

    activeTopics.forEach(t => {
      let isDue = false;
      if (!t.day4Done && t.day4Date <= today) isDue = true;
      else if (t.day4Done && !t.day7Done && t.day7Date <= today) isDue = true;

      if (isDue) {
        dueCount++;
        subjectDueCounts[t.subject] = (subjectDueCounts[t.subject] || 0) + 1;
      }
    });

    let mostNeglectedSubject = null;
    let maxDue = 0;
    for (const [subject, count] of Object.entries(subjectDueCounts)) {
      if (count > maxDue) {
        maxDue = count;
        mostNeglectedSubject = subject;
      }
    }

    // 3. Revisions Done
    let revisionsCompletedTotal = 0;
    let revisionsCompletedThisWeek = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    allTopics.forEach(t => {
      if (t.day4Done) {
        revisionsCompletedTotal++;
        if (t.day4CompletedAt >= sevenDaysAgo) revisionsCompletedThisWeek++;
      }
      if (t.day7Done) {
        revisionsCompletedTotal++;
        if (t.day7CompletedAt >= sevenDaysAgo) revisionsCompletedThisWeek++;
      }
    });

    // 4. Current Streak Calculation
    const activityDates = new Set();
    allTopics.forEach(t => {
      if (t.dateAdded) activityDates.add(t.dateAdded);
      if (t.day4CompletedAt) activityDates.add(toLocalYMD(t.day4CompletedAt));
      if (t.day7CompletedAt) activityDates.add(toLocalYMD(t.day7CompletedAt));
    });

    const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a)); // Descending
    
    let currentStreak = 0;
    let checkDate = new Date(); 
    
    let activeToday = sortedDates.includes(toLocalYMD(checkDate));
    
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    let activeYesterday = sortedDates.includes(toLocalYMD(yesterday));

    if (activeToday || activeYesterday) {
      let tempDate = new Date();
      if (!activeToday && activeYesterday) {
        tempDate.setDate(tempDate.getDate() - 1); // Start counting from yesterday if nothing done today yet
      }
      
      while (true) {
        let dateString = toLocalYMD(tempDate);
        if (sortedDates.includes(dateString)) {
          currentStreak++;
          tempDate.setDate(tempDate.getDate() - 1); // Walk backwards one day at a time
        } else {
          break; // Streak broken
        }
      }
    }

    res.status(200).json({
      totalTopics,
      dueToday: dueCount,
      revisionsCompletedTotal,
      revisionsCompletedThisWeek,
      mostNeglectedSubject,
      currentStreak: currentStreak || null
    });

  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ error: { message: 'Failed to compute stats' } });
  }
});

module.exports = router;