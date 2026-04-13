export function loadJSON(path) {
    return new Promise((resolve, reject) => {
        $.getJSON(path)
            .done(data => resolve(data))
            .fail(err => reject(err));
    });
}