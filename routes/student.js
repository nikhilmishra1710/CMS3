const express = require('express');
const controller = require('../controllers/student');
const { requireAuth, forwardAuth } = require('../middlewares/studentAuth');

const router = express.Router();


router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);

router.get('/dashboard', requireAuth, controller.getDashboard);
router.get('/profile', requireAuth, controller.getProfile);
router.get('/marks', requireAuth, controller.getMarks);
router.get('/selectAttendance', requireAuth, controller.getSelectAttendance);
router.post('/selectAttendance', requireAuth, controller.postSelectAttendance);

router.get('/timetable', requireAuth, controller.getTimeTable);

router.get('/logout', requireAuth, controller.getLogout);
router.get('/feedback', requireAuth, controller.getFeedback);
router.post('/feedback',requireAuth,controller.postFeedback);
router.get('/feedbacksuccess',requireAuth, (req, res) => {
    res.render('Student/feedbacksuccess');
});  

router.get('/upcoming-exams', requireAuth, controller.getUpcomingExams);


module.exports = router;
