function create_mr() {
    const elem = getElementByXpath('//*[@id="merge_request_squash"]');
    elem.checked = true;
}

window.addEventListener('load', create_mr);