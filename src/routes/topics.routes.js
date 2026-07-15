const express = require('express');
const Topic = require('../models/Topic');
const requireAuth = require('../middleware/requireAuth');
const { todayStr, addDays, daysBetween } = require('../utils/dates');

const router = express.Router();

// Guard all routes in this file with JWT authentication
router.use(requireAuth);

// ==========================================
// 1. GET DUE TOPICS (Must be placed before /:id routes)
// ==========================================
router.get('/topics/due', async (req, res) => {
  try {
    const today = todayStr();
    const activeTopics = await Topic.find({ status: 'active' });
    const dueTopics = [];

    activeTopics.forEach(t => {
      if (!t.day4Done && t.day4Date <= today) {
        dueTopics.push({
          id: t._id,
          topic: t.topic,
          subject: t.subject,
          priority: t.priority,
          stage: 4,
          dueDate: t.day4Date,
          overdueBy: daysBetween(t.day4Date, today)
        });
      } else if (t.day4Done && !t.day7Done && t.day7Date <= today) {
        dueTopics.push({
          id: t._id,
          topic: t.topic,
          subject: t.subject,
          priority: t.priority,
          stage: 7,
          dueDate: t.day7Date,
          overdueBy: daysBetween(t.day7Date, today)
        });
      }
    });

    // Sort by most overdue first
    dueTopics.sort((a, b) => b.overdueBy - a.overdueBy);
    res.status(200).json(dueTopics);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to compute due topics' } });
  }
});

// ==========================================
// 2. EXPORT BACKUP
// ==========================================
router.get('/topics/export', async (req, res) => {
  try {
    const allTopics = await Topic.find({});
    res.setHeader('Content-Disposition', `attachment; filename="revision-ledger-backup-${todayStr()}.json"`);
    res.status(200).json(allTopics);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to export topics' } });
  }
});

// ==========================================
// 3. GET DISTINCT SUBJECTS
// ==========================================
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Topic.distinct('subject', { status: 'active' });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch subjects' } });
  }
});

// ==========================================
// 4. CREATE A TOPIC
// ==========================================
router.post('/topics', async (req, res) => {
  try {
    const { subject, topic, notes, priority } = req.body;
    
    if (!subject || !subject.trim() || !topic || !topic.trim()) {
      return res.status(400).json({ error: { message: 'Subject and topic are required' } });
    }

    const dateAdded = todayStr();
    // Rule logic applied here automatically: Day 1 + 3 days = Day 4, Day 1 + 6 days = Day 7
    const day4Date = addDays(dateAdded, 3);
    const day7Date = addDays(dateAdded, 6);

    const newTopic = await Topic.create({
      subject: subject.trim(),
      topic: topic.trim(),
      notes: notes ? notes.trim() : '',
      priority: priority || 'medium',
      dateAdded,
      day4Date,
      day7Date
    });

    res.status(201).json(newTopic);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to create topic' } });
  }
});

// ==========================================
// 5. GET ALL TOPICS (With Filters & Search)
// ==========================================
router.get('/topics', async (req, res) => {
  try {
    const { search, subject, priority, status } = req.query;
    let query = {};

    // Status filter
    if (status === 'all') {
      // Do nothing, match all
    } else if (status === 'archived') {
      query.status = 'archived';
    } else {
      query.status = 'active'; // Default behavior
    }

    // Exact matches
    if (subject) query.subject = subject;
    if (priority) query.priority = priority;

    // Search matches subject OR topic
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { topic: { $regex: search, $options: 'i' } }
      ];
    }

    const topics = await Topic.find(query).sort({ createdAt: -1 });
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to fetch topics' } });
  }
});

// ==========================================
// 6. REVISE A TOPIC (Adaptive Scheduling)
// ==========================================
router.patch('/topics/:id/revise', async (req, res) => {
  try {
    const { stage, confidence } = req.body;
    
    if (![4, 7].includes(stage) || !['weak', 'okay', 'strong'].includes(confidence)) {
      return res.status(400).json({ error: { message: 'Invalid stage or confidence data' } });
    }

    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: { message: 'Topic not found' } });

    if (stage === 4) {
      topic.day4Done = true;
      topic.day4Confidence = confidence;
      topic.day4CompletedAt = new Date();
      
      // Adaptive rule: Pull the next revision closer if weak
      if (confidence === 'weak') {
        topic.day7Date = addDays(todayStr(), 2);
      }
    } else if (stage === 7) {
      topic.day7Done = true;
      topic.day7Confidence = confidence;
      topic.day7CompletedAt = new Date();
    }

    const updatedTopic = await topic.save();
    res.status(200).json(updatedTopic);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to mark revision' } });
  }
});

// ==========================================
// 7. ARCHIVE A TOPIC
// ==========================================
router.patch('/topics/:id/archive', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ error: { message: 'Topic not found' } });

    topic.status = topic.status === 'active' ? 'archived' : 'active';
    const updatedTopic = await topic.save();
    res.status(200).json(updatedTopic);
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to archive topic' } });
  }
});

// ==========================================
// 8. DELETE A TOPIC
// ==========================================
router.delete('/topics/:id', async (req, res) => {
  try {
    const topic = await Topic.findByIdAndDelete(req.params.id);
    if (!topic) return res.status(404).json({ error: { message: 'Topic not found' } });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: { message: 'Failed to delete topic' } });
  }
});

module.exports = router;