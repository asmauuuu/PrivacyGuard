document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.querySelector('input[type="password"]');
    const strengthText = document.getElementById('strengthText');

    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;

        strengthText.textContent = 
            strength < 2 ? 'Weak' :
            strength < 4 ? 'Medium' : 'Strong';
            
        strengthText.style.color = 
            strength < 2 ? '#e53e3e' :
            strength < 4 ? '#d69e2e' : '#38a169';
    });
});