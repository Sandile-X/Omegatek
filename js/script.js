let menu = document.querySelector('#menu-btn');
let navbarLinks = document.querySelector('.header .navbar .links');

menu.onclick = () =>{
   menu.classList.toggle('fa-times');
   navbarLinks.classList.toggle('active');
}

window.onscroll = () =>{
   menu.classList.remove('fa-times');
   navbarLinks.classList.remove('active');

   if(window.scrollY > 60){
      document.querySelector('.header .navbar').classList.add('active');
   }else{
      document.querySelector('.header .navbar').classList.remove('active');
   }
}
// contact us section

document.getElementById("inputBox").addEventListener("submit", function(event) {
   const name = document.getElementById("name").value.trim();
   const email = document.getElementById("email").value.trim();
   const message = document.getElementById("message").value.trim();

   if (!name || !email || !message) {
       alert("All fields are required!");
       event.preventDefault();
   }
});

document.getElementById("inputBox").addEventListener("submit", function(event) {
   event.preventDefault(); // Prevent default form submission

   const formData = new FormData(this);

   fetch("contact_us.php", {
       method: "POST",
       body: formData,
   })
   .then(response => response.json())
   .then(data => {
       if (data.status === "success") {
           alert(data.message); // Show success alert
           this.reset(); // Reset the form
       } else {
           alert(data.message); // Show error alert
       }
   })
   .catch(error => {
       alert("An error occurred. Please try again.");
       console.error(error);
   });
});

