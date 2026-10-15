
CREATE DATABASE IF NOT EXISTS studygraph
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE studygraph;


CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME DEFAULT NULL,
    consecutive_failed_attempts INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;



CREATE TABLE subjects (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    name VARCHAR(100) NOT NULL,

    description TEXT NULL,

    color CHAR(7) DEFAULT '#6366F1',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_subject_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_subject_user_name
        UNIQUE (user_id, name)

) ENGINE=InnoDB;



CREATE TABLE notes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subject_id INT UNSIGNED NOT NULL,

    title VARCHAR(255) NOT NULL,

    content LONGTEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_note_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB;



CREATE TABLE materials (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subject_id INT UNSIGNED NOT NULL,

    original_name VARCHAR(255) NOT NULL,

    stored_name VARCHAR(255) NOT NULL UNIQUE,

    file_path VARCHAR(500) NOT NULL,

    file_type VARCHAR(100) NOT NULL,

    file_size BIGINT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_material_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB;



CREATE TABLE note_connections (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    source_note_id INT UNSIGNED NOT NULL,

    target_note_id INT UNSIGNED NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_connection_source
        FOREIGN KEY (source_note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_connection_target
        FOREIGN KEY (target_note_id)
        REFERENCES notes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT uq_note_connection
        UNIQUE (source_note_id, target_note_id),

    CONSTRAINT chk_note_connection
        CHECK (source_note_id < target_note_id)

) ENGINE=InnoDB;




CREATE TABLE quizzes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    subject_id INT UNSIGNED NOT NULL,

    note_id INT UNSIGNED NULL,

    title VARCHAR(255) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_quiz_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_quiz_note
        FOREIGN KEY (note_id)
        REFERENCES notes(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB;


CREATE TABLE quiz_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    quiz_id INT UNSIGNED NOT NULL,

    question TEXT NOT NULL,

    answer_a TEXT NOT NULL,

    answer_b TEXT NOT NULL,

    answer_c TEXT NOT NULL,

    answer_d TEXT NOT NULL,

    correct_answer ENUM(
        'A',
        'B',
        'C',
        'D'
    ) NOT NULL,

    explanation TEXT NULL,

    position SMALLINT UNSIGNED DEFAULT 1,

    CONSTRAINT fk_question_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB;



CREATE TABLE quiz_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    quiz_id INT UNSIGNED NOT NULL,

    user_id INT UNSIGNED NOT NULL,

    score SMALLINT UNSIGNED NOT NULL,

    total_questions SMALLINT UNSIGNED NOT NULL,

    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attempt_quiz
        FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attempt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_quiz_score
        CHECK (
            score <= total_questions
            AND total_questions > 0
        )

) ENGINE=InnoDB;


CREATE INDEX idx_subjects_user
ON subjects(user_id);

CREATE INDEX idx_notes_subject
ON notes(subject_id);

CREATE INDEX idx_materials_subject
ON materials(subject_id);

CREATE INDEX idx_connections_source
ON note_connections(source_note_id);

CREATE INDEX idx_connections_target
ON note_connections(target_note_id);

CREATE INDEX idx_quizzes_subject
ON quizzes(subject_id);

CREATE INDEX idx_quizzes_note
ON quizzes(note_id);

CREATE INDEX idx_quiz_questions_quiz
ON quiz_questions(quiz_id);

CREATE INDEX idx_attempts_quiz
ON quiz_attempts(quiz_id);

CREATE INDEX idx_attempts_user
ON quiz_attempts(user_id);
