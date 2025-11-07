document.addEventListener('DOMContentLoaded', () => {
    const enterButton = document.getElementById('enterButton');

    enterButton.addEventListener('click', () => {
        // Redirect the user to the main index page
        window.location.href = 'index.html';
    });
});