<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alumni Registration</title>
    <link href="css.css" rel="stylesheet" type="text/css">
    <style>
        .form {
            color: rgb(19, 159, 19);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2 class="form">Registration Form</h2>
        <div class="form-container">
            <form method="post" action="register.php">
                <div class="input-name">
                    <input type="text" name="fname" placeholder="First Name" class="name" required>
                    <span>
                        <input type="text" name="lname" placeholder="Last Name" class="name" required>
                    </span>
                </div>
                
                <div class="input-name">
                    <select class="department" name="department" required>
                        <option value="">Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="EEE">EEE</option>
                        <option value="IPE">IPE</option>
                        <option value="CIVIL">CIVIL</option>
                        <option value="ME">ME</option>
                        <option value="BBA">BBA</option>
                        <option value="ENGLISH">ENGLISH</option>
                    </select>
                    <span>
                        <input type="text" placeholder="Batch" name="batch" class="name" required>
                    </span>
                </div>

                <div class="input-name">
                    <select class="year" name="year" required>
                        <option value="">Passing Year</option>
                        <option>2015</option>
                        <option>2016</option>
                        <option>2017</option>
                        <option>2018</option>
                        <option>2019</option>
                        <option>2020</option>
                        <option>2021</option>
                        <option>2022</option>
                        <option>2023</option>
                        <option>2024</option>
                    </select>
                </div>

                <div class="input-name">
                    <input type="radio" class="radio-button" name="gender" value="Male" required>
                    <label>Male</label>
                    <input type="radio" class="radio-button" name="gender" value="Female" required>
                    <label>Female</label>
                </div>

                <div class="input-name">
                    <input type="email" name="email" placeholder="Email" class="text-name" required>
                    <span>
                        <input type="text" placeholder="Phone Number" name="phone" class="text-name" required>
                    </span>
                </div>

                <div class="input-name">
                    <input type="password" name="password" placeholder="Password" class="name" required>
                    <span>
                        <input type="password" placeholder="Confirm Password" class="name" required>
                    </span>
                </div>

                <div class="input-name">
                    <input type="checkbox" class="check-button" required>
                    <label>I accept the terms and conditions</label>
                </div>

                <div class="input-name">
                    <input type="submit" class="button" value="Register" name="signUp">
                    <p>Already have an account? <a href="index.php">Login now</a></p>
                </div>
            </form>
        </div>
    </div>   
</body>
</html>