// Save information to local storage
document.getElementById("saveButton").addEventListener("click", () => {
    const userProfile = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        gender: document.getElementById("gender").value,
        department: document.getElementById("department").value,
        batch: document.getElementById("batch").value,
        passingYear: document.getElementById("passingYear").value,
        jobPlace: document.getElementById("jobPlace").value,
        jobTitle: document.getElementById("jobTitle").value,
        paymentMethod: document.getElementById("paymentMethod").value
    };

    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    alert("Information saved successfully!");
});

// Load information from local storage on page load
document.addEventListener("DOMContentLoaded", () => {
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (savedProfile) {
        document.getElementById("username").value = savedProfile.username || "";
        document.getElementById("email").value = savedProfile.email || "";
        document.getElementById("phone").value = savedProfile.phone || "";
        document.getElementById("address").value = savedProfile.address || "";
        document.getElementById("gender").value = savedProfile.gender || "";
        document.getElementById("department").value = savedProfile.department || "";
        document.getElementById("batch").value = savedProfile.batch || "";
        document.getElementById("passingYear").value = savedProfile.passingYear || "";
        document.getElementById("jobPlace").value = savedProfile.jobPlace || "";
        document.getElementById("jobTitle").value = savedProfile.jobTitle || "";
        document.getElementById("paymentMethod").value = savedProfile.paymentMethod || "";
    }
});

// Save information to local storage and redirect to the dashboard
document.getElementById("saveButton").addEventListener("click", () => {
    const userProfile = {
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
        gender: document.getElementById("gender").value,
        department: document.getElementById("department").value,
        batch: document.getElementById("batch").value,
        passingYear: document.getElementById("passingYear").value,
        jobPlace: document.getElementById("jobPlace").value,
        jobTitle: document.getElementById("jobTitle").value,
        paymentMethod: document.getElementById("paymentMethod").value
    };

    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    alert("Information saved successfully!");

    // Redirect to the dashboard after saving
    window.location.href = "dashboard.html"; // Change the URL to your actual dashboard page
});

// Load information from local storage on page load
document.addEventListener("DOMContentLoaded", () => {
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (savedProfile) {
        document.getElementById("username").value = savedProfile.username || "";
        document.getElementById("email").value = savedProfile.email || "";
        document.getElementById("phone").value = savedProfile.phone || "";
        document.getElementById("address").value = savedProfile.address || "";
        document.getElementById("gender").value = savedProfile.gender || "";
        document.getElementById("department").value = savedProfile.department || "";
        document.getElementById("batch").value = savedProfile.batch || "";
        document.getElementById("passingYear").value = savedProfile.passingYear || "";
        document.getElementById("jobPlace").value = savedProfile.jobPlace || "";
        document.getElementById("jobTitle").value = savedProfile.jobTitle || "";
        document.getElementById("paymentMethod").value = savedProfile.paymentMethod || "";
    }
});
