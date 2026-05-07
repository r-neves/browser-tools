const poll = setInterval(() => {
    const btn = document.getElementById('radix-:ra:-trigger-N');
    if (btn && btn.dataset.state === 'inactive') {
        clearInterval(poll);
        btn.focus();
    }
}, 200);

setTimeout(() => clearInterval(poll), 15000);
