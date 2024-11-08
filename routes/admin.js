const express = require('express');
const controller = require('../controllers/admin');
const { requireAuth, forwardAuth } = require('../middlewares/adminAuth');

const router = express.Router();


router.get('/login', forwardAuth, controller.getLogin);
router.post('/login', controller.postLogin);


router.get('/register', forwardAuth, controller.getRegister);
router.post('/register', controller.postRegister);


router.get('/dashboard', requireAuth, controller.getDashboard);

router.get('/logout', requireAuth, controller.getLogout);


router.get('/profile', requireAuth, controller.getProfile);



router.get('/info_settings', requireAuth, controller.getInfoSettings);
router.post('/info_settings', requireAuth, controller.postInfoSettings);
router.get('/password_settings', requireAuth, controller.getPasswordSettings);
router.post('/password_settings', requireAuth, controller.postPasswordSettings);


router.get('/addStaff', requireAuth, controller.getAddStaff);
router.post('/addStaff', requireAuth, controller.postAddStaff);

router.get('/getStaff', requireAuth, controller.getRelevantStaff);
router.post('/getStaff', requireAuth, controller.postRelevantStaff);

router.get('/getAllStaffs', requireAuth, controller.getAllStaff);

router.get('/settings/staff/:id', requireAuth, controller.getStaffSettings);
router.post('/settings/staff', requireAuth, controller.postStaffSettings);


router.get('/addStudent', requireAuth, controller.getAddStudent);
router.post('/addStudent', requireAuth, controller.postAddStudent);

router.get('/getStudent', requireAuth, controller.getRelevantStudent);
router.post('/getStudent', requireAuth, controller.postRelevantStudent);

router.get('/getAllStudents', requireAuth, controller.getAllStudent);

router.get('/settings/student/:id', requireAuth, controller.getStudentSettings);
router.post('/settings/student', requireAuth, controller.postStudentSettings);


router.get('/getClass', requireAuth, controller.getClass);

router.get('/addClass', requireAuth, controller.getAddClass);
router.post('/addClass', controller.postAddClass);

router.get('/settings/class/:id', requireAuth, controller.getClassSettings);
router.post('/settings/class', requireAuth, controller.postClassSettings);


router.get('/getDept', requireAuth, controller.getDept);

router.get('/addDept', requireAuth, controller.getAddDept);
router.post('/addDept', requireAuth, controller.postAddDept);

router.get('/settings/department/:id', requireAuth, controller.getDeptSettings);
router.post('/settings/department', requireAuth, controller.postDeptSettings);


router.get('/getAllCourses', requireAuth, controller.getAllCourse);

router.get('/getCourse', requireAuth, controller.getRelevantCourse);
router.post('/getCourse', requireAuth, controller.postRelevantCourse);

router.get('/addCourse', requireAuth, controller.getAddCourse);
router.post('/addCourse', requireAuth, controller.postAddCourse);

router.get('/settings/course/:id', requireAuth, controller.getCourseSettings);
router.post('/settings/course', requireAuth, controller.postCourseSettings);

module.exports = router;
