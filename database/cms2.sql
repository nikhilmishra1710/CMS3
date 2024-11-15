drop database if exists cumsdbms;

create database cumsdbms;

use cumsdbms;

CREATE TABLE IF NOT EXISTS `admin`(
	`admin_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    PRIMARY KEY(`admin_id`)
);

CREATE TABLE IF NOT EXISTS `course` (
	`c_id` VARCHAR(100) NOT NULL UNIQUE,
	`semester` INT NOT NULL,
	`name` VARCHAR(255) NOT NULL,
	`c_type` VARCHAR(255) NOT NULL,
	`credits` INT NOT NULL,
	`dept_id` VARCHAR(255) NOT NULL,
	PRIMARY KEY (`c_id`)
);

CREATE TABLE IF NOT EXISTS `student` (
	`s_id` VARCHAR(36) NOT NULL,
	`s_name` VARCHAR(255) NOT NULL,
	`gender` VARCHAR(6) NOT NULL,
	`dob` DATE NOT NULL,
	`email` VARCHAR(255) NOT NULL UNIQUE,
	`s_address` VARCHAR(255) NOT NULL,
	`contact` VARCHAR(12) NOT NULL,
	`password` VARCHAR(255) NOT NULL,
	`section` INT NOT NULL,
	`joining_date` DATE DEFAULT(CURRENT_DATE),
	`dept_id` VARCHAR(255),	
	PRIMARY KEY (`s_id`)
);

CREATE TABLE IF NOT EXISTS `staff` (
	`st_id` VARCHAR(36) NOT NULL,
	`st_name` VARCHAR(255) NOT NULL,
	`gender` VARCHAR(6) NOT NULL,
	`dob` DATE NOT NULL,
	`email` VARCHAR(255) NOT NULL UNIQUE,
	`st_address` VARCHAR(255) NOT NULL,
	`contact` VARCHAR(12) NOT NULL,
	`dept_id` VARCHAR(255) NOT NULL,
	`password` VARCHAR(255) NOT NULL,
	PRIMARY KEY (`st_id`)
);

CREATE TABLE IF NOT EXISTS `department` (
	`dept_id` VARCHAR(255) NOT NULL UNIQUE,
	`d_name` VARCHAR(255) NOT NULL UNIQUE,
	PRIMARY KEY (`dept_id`)
);

CREATE TABLE IF NOT EXISTS `class` (
	`class_id` INT NOT NULL AUTO_INCREMENT UNIQUE,
	`section` INT NOT NULL,
	`semester` INT NOT NULL,
	`year` DATE DEFAULT(CURRENT_DATE),
	`c_id` VARCHAR(100),
	`st_id` VARCHAR(36) NOT NULL,
	PRIMARY KEY (`class_id`)
);

CREATE TABLE IF NOT EXISTS `attendance` (
	`s_id` VARCHAR(36) NOT NULL,
	`date` DATE NOT NULL,
	`c_id` VARCHAR(100) NOT NULL,
	`status` BOOLEAN DEFAULT NULL,
	PRIMARY KEY (`s_id`,`c_id`,`date`)
);

CREATE TABLE IF NOT EXISTS `time_table` (
	`c_id` VARCHAR(100),
	`st_id` VARCHAR(36) NOT NULL,
	`section` INT NOT NULL,
	`day` INT NOT NULL,
	`start_time` TIME NOT NULL,
	`end_time` TIME NOT NULL,
	PRIMARY KEY (`c_id`,`section`,`day`)
);

CREATE TABLE IF NOT EXISTS `feedback_form` (
    `feedback_id` VARCHAR(100) NOT NULL,
    `st_id` VARCHAR(36) NOT NULL,
    `course_id` VARCHAR(100) NOT NULL,
    `feedback_text` TEXT NOT NULL,
    `rating` INT CHECK (`rating` BETWEEN 1 AND 5),
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`feedback_id`)
);

CREATE TABLE exams (
  exam_id INT AUTO_INCREMENT PRIMARY KEY,
  c_id VARCHAR(100) NOT NULL,
  st_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  FOREIGN KEY (c_id) REFERENCES course(c_id),
  FOREIGN KEY (st_id) REFERENCES staff(st_id)
);

CREATE TABLE IF NOT EXISTS `marks` (
    `mark_id` INT NOT NULL AUTO_INCREMENT,
    `s_id` VARCHAR(36) NOT NULL,            
    `c_id` VARCHAR(100) NOT NULL,          
    `exam_id` INT NOT NULL,           
    `total_marks` INT NOT NULL,            
    `obtained_marks` INT NOT NULL,          
    PRIMARY KEY (`mark_id`),
    FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (`exam_id`) REFERENCES `exams`(`exam_id`) ON UPDATE CASCADE ON DELETE RESTRICT
);

ALTER TABLE `course` ADD CONSTRAINT `course_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) on update cascade on delete restrict;

ALTER TABLE `student` ADD CONSTRAINT `student_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) on update cascade on delete restrict;

ALTER TABLE `staff` ADD CONSTRAINT `staff_fk0` FOREIGN KEY (`dept_id`) REFERENCES `department`(`dept_id`) on update cascade on delete restrict;

ALTER TABLE `fee` ADD CONSTRAINT `fee_fk0` FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) on update cascade on delete restrict;

ALTER TABLE `attendance` ADD CONSTRAINT `attendance_fk0` FOREIGN KEY (`s_id`) REFERENCES `student`(`s_id`) on update cascade on delete restrict;

ALTER TABLE `attendance` ADD CONSTRAINT `attendance_fk1` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) on update cascade on delete restrict;

ALTER TABLE `class` ADD CONSTRAINT `class_fk0` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) on update cascade on delete restrict;

ALTER TABLE `class` ADD CONSTRAINT `class_fk1` FOREIGN KEY (`st_id`) REFERENCES `staff`(`st_id`) on update cascade on delete restrict;

ALTER TABLE `time_table` ADD CONSTRAINT `time_table_fk0` FOREIGN KEY (`c_id`) REFERENCES `course`(`c_id`) on update cascade on delete restrict;

ALTER TABLE `time_table` ADD CONSTRAINT `time_table_fk1` FOREIGN KEY (`st_id`) REFERENCES `staff`(`st_id`) on update cascade on delete restrict;

alter table admin
add resetLink varchar(255) default '';

alter table student 
add resetLink varchar(255) default '';

alter table staff
add resetLink varchar(255) default '';