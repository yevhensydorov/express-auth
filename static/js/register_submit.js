const submitButton = document.getElementById('submit'); 

submitButton.addEventListener('click',function(event){
	event.preventDefault();
	const login = document.getElementById('login').value;
	const password = document.getElementById('password').value;
	// console.log(login,password)

	const user = {email: login, password: password};
	fetch('/register', {
		method: 'POST',
		headers:{
			'Content-Type' : 'application/json'
		},
		body: JSON.stringify(user)
	})

})	
