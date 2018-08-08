!(function(w){
    var img = document.getElementById('study');
    img.onclick=function(){
        console.log(img.ondblclick);
        img.style.background='red';   
    }
})(window);