const util = {
    /**
     * Generates a random string ID
     * @param {Number} length 
     * @return {String}
     */
    generateId(length){
        const selection = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        let id = "";
        for(let i = 0; i < length; i++){
            let selectedChar = selection.charAt(Math.floor(Math.random()*selection.length));
            id += selectedChar;
        }
        return id;
    },

    /**
     * Generates a random access code 6 characters long
     * @return {String}
     */
    generateAccessCode(){
        const selection = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        let code = "";
        for(let i = 0; i < 6; i++){
            let selectedChar = selection.charAt(Math.floor(Math.random()*selection.length));
            code += selectedChar;
        }
        return code;
    }
    
};

module.exports = util;