function addWeekDay() {
    const elems = document.querySelectorAll("td.centerText.nowrap_text");
    
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const text = elem.innerText;
        const date = new Date(text);
        const day = date.getDay();
        const weekDay = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][day];
        elem.innerText = `${text} (${weekDay})`;
    }
}

window.addEventListener('load', addWeekDay);
window.addEventListener('popstate', addWeekDay);