<?php
include 'connect.php';

// Secure Registration Handling
if (isset($_POST['signUp'])) {
    $firstName = trim($_POST['fname']);
    $lastName = trim($_POST['lname']);
    $email = trim($_POST['email']);
    $passwordRaw = trim($_POST['password']);
    $password = password_hash($passwordRaw, PASSWORD_BCRYPT); // Secure password hashing

    // Validate inputs
    if (empty($firstName) || empty($lastName) || empty($email) || empty($passwordRaw)) {
        die("All fields are required!");
    }

    // Check if email exists using prepared statement
    $checkEmail = $conn->prepare("SELECT id FROM user WHERE email = ?");
    $checkEmail->bind_param("s", $email);
    $checkEmail->execute();
    $result = $checkEmail->get_result();

    if ($result->num_rows > 0) {
        echo "Email address already exists!";
    } else {
        // Insert user using prepared statement
        $insertQuery = $conn->prepare("INSERT INTO user (fname, lname, email, password) VALUES (?, ?, ?, ?)");
        $insertQuery->bind_param("ssss", $firstName, $lastName, $email, $password);

        if ($insertQuery->execute()) {
            header("Location: index.php");
            exit();
        } else {
            echo "Registration Error!";
        }
    }
    $checkEmail->close();
}

// Secure Login Handling
if (isset($_POST['signIn'])) {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    // Validate inputs
    if (empty($email) || empty($password)) {
        die("Email and password are required!");
    }

    // Securely fetch user
    $sql = $conn->prepare("SELECT id, fname, lname, password FROM user WHERE email = ?");
    $sql->bind_param("s", $email);
    $sql->execute();
    $result = $sql->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            session_start();
            $_SESSION['user'] = $user;
            header("Location: index2.php");
            exit();
        } else {
            echo "Incorrect password!";
        }
    } else {
        echo "Error! User not found.";
    }
    $sql->close();
}

// Close Database Connection
$conn->close();
?>