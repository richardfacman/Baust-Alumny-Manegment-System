<!DOCTYPE html>
<html lang="en">
<head>
<style>
.button {
  background-color: rgb(19, 159, 19);
  border: none;
  border-radius:5px;
  color: white;
  padding: 10px 25px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  font-weight: 500;
  margin: 3px 1px;
  cursor: pointer;
}
</style>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login Form</title>
  <link rel="stylesheet" href="styles.css">
  <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet'>
</head>
<body>
  <div class="wrapper">
    <form method="post" action="register.php">
      <h1>Login</h1>
      <div class="input-box">
        <input type="text" id="username" name="email" placeholder="Email" required>
        <i class='bx bxs-user'></i>
      </div>
      <div class="input-box">
        <input type="password" id="password" name="password" placeholder="Password" required>
        <i class='bx bxs-lock-alt' ></i>
      </div>
      <div class="remember-forgot">
        <label><input type="checkbox">Remember Me</label>
        <a href="#">Forgot Password</a>
      </div>
      <!-- Set button type to 'button' and add parentheses to verifyLogin() -->
      <!-- <button type="button" class="btn" name="signIn">Login</button> -->
      <input type="submit" class="btn" value="Login" name="signIn">
      <div class="register-link">
      <!-- <a href="index3.html">Admin Login</a> -->
      <button class="button" onclick="func()">Admin Login</button>
      <p style="padding-top:20px">Don't have an account? <a href="RegistrationForm.php">Register</a></p>
      </div>
    </form>
  </div>

  <script>
    function func(){
      window.location.href = "index3.html";
    }
  </script>
  
</body>
</html>
