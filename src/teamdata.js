export function setTeamkey(key) {
    localStorage.setItem('teamdata',key);
}
export function getTeamkey() {
    return localStorage.getItem('teamdata');
} 