var app = new Vue({
  el : "#app",
  data:{
    teams:[],
    matches:[],
    locations:[],
    locationSearch:"",
    menu:false,
    page:"Home",
    lastPages:[],
    detailedMatch:null,
    lastDetailedMatches:[],
    detailedTeam:{},
    lastDetailedTeams:[],
    scheduleFilterT:"All",
    scheduleFilterL:"All",
    forumPosts: [],
    logged : false
  },

  created:function(){


    //Traemos los datos desde el json (info.js)
    this.teams = info.teams;
    this.matches = info.matches;
    this.locations = info.locations;

    //No dar bola(?
    var height = $(window).height();
    $(".fullPage").height(height);

    //Lleno los campos de los equipos y las locations del array de matches,
    //para poder usarlos en futuras diferentes paginas y evitar tener que hacerlo luego
    for(let i in this.matches){
      for(let z in this.teams){
        if (this.teams[z].team_name == this.matches[i].team1) {
          this.matches[i].team1 = this.teams[z]
        }
        if (this.teams[z].team_name == this.matches[i].team2) {
          this.matches[i].team2 = this.teams[z]
        }
      }
      for(let z in this.locations){
        if (this.locations[z].id == this.matches[i].location_id) {
          this.matches[i].location = this.locations[z]
        }
      }
    }


  },

  methods:{

    funcCom: function(postKey){
      var commInput = document.getElementById("comm-input-"+postKey).value
      
      var aux = commInput.replace(/ /g,"")
      
      if(aux==""){
        return alert("The comment must have some text on it!");
      }else{
        var username = firebase.auth().currentUser.displayName;
        var uid = firebase.auth().currentUser.uid;

        createNewComment(postKey, username, uid, commInput);
        document.getElementById("comm-input-"+postKey).value = '';
      }
      
    },

    mForum: function(id){
      this.lastPages.push(this.page)

      this.page="Match Forum";

      cleanupUi();
      startDatabaseQueries();
      
    },

    //Funcion que sucede cuando se tapea el boton del menu
    toggleMenu: function(){
      if (this.menu==true) {
        this.menu=false;
      }else {
        this.menu=true;
      }
    },

    //Click en alguna opcion del menu
    changePage: function(event){
      this.page=event.srcElement.innerHTML;
      this.menu=false;
      document.documentElement.scrollTop = 0;
    },

    nextMatch: function(){
      var currTime = new Date();  //Fecha actual

      for(var i = 0 ; i < this.matches.length ; i++){ //Iteracion del array de matches
        var matchTime = new Date("2019" , this.matches[i].monthN , this.matches[i].day , this.matches[i].timeH , this.matches[i].timeM); //Fecha del match actual
        if (currTime < matchTime) { //Comparacion si el match actual ya se jugó o no
          return this.matches[i]; //Devuelve el proximo match y termina la funcion
        }
      }
    },

    nextTeamMatch: function(teamName){
      var currTime = new Date();  //Fecha actual

      for(var i = 0 ; i < this.matches.length ; i++){ //Iteracion del array de matches
        var matchTime = new Date("2019" , this.matches[i].monthN , this.matches[i].day , this.matches[i].timeH , this.matches[i].timeM); //Fecha del match actual
        if(this.matches[i].team1.team_name==teamName || this.matches[i].team2.team_name==teamName){
          if (currTime < matchTime) { //Comparacion si el match actual ya se jugó o no
            return this.matches[i]; //Devuelve el proximo match y termina la funcion
          }
        }

      }
    },

    //Al tapear en algun match, sea en el Schedule o en el Next match
    matchDetails: function(id){

      this.lastPages.push(this.page) //Guarda la pagina actual para poder volver a ella

      for(let i in this.matches){
        if (this.matches[i].matchID == id) {
          //Encuentra el match y lo guarda en detailedMatch para que se pueda acceder a él desde la pag
          this.detailedMatch=this.matches[i]
        }
      }

      if (this.page == "Team Information") {
        this.lastDetailedTeams.push(this.detailedTeam)
      }
      document.documentElement.scrollTop = 0;
      this.page="Game Information" //Hace visible los detalles en pantalla
    },

    matchDetailsLS: function(id){
      for(let i in this.matches){
        if (this.matches[i].matchID == id) {
          //Encuentra el match y lo guarda en detailedMatch para que se pueda acceder a él desde la pag
          this.detailedMatch=this.matches[i]
        }
      }
    },

    teamDetails: function(teamClicked){
      this.lastPages.push(this.page)

      for(let i in this.teams){
        if (this.teams[i].team_name==teamClicked) {
          this.detailedTeam = this.teams[i];
        }


      }

      if (this.page=="Game Information") {
        this.lastDetailedMatches.push(this.detailedMatch)
      }
      document.documentElement.scrollTop = 0;
      this.page = "Team Information"
    },

    backArrow: function(){
      
      var page = this.lastPages.pop()

      if(this.page != "Match Forum"){
        if(page=="Team Information"){
          this.detailedTeam = this.lastDetailedTeams.pop()
        }else if (page=="Game Information") {
          this.detailedMatch = this.lastDetailedMatches.pop()
        }
      }
      
      document.documentElement.scrollTop = 0;
      this.page=page
    }
  },



  computed:{

    filteredLocations(){

      
      if(this.locationSearch==""){
        return this.locations;
      }else{
        var filtered = [];
        for(var i = 0 ; i < this.locations.length ; i++){

          var name = this.locations[i].name.toLowerCase();
          var search = this.locationSearch.toLowerCase();

          if (name.search(search) != -1) {
            filtered.push(this.locations[i]);
          }
        }
        return filtered;
      }
    },

    positionedTeams(){
      var teams = [];

      for(let i in this.teams){
        teams.push(this.teams[i])
      }
      return teams.sort(function(a,b){
        return a.team_position - b.team_position;
      })
    },

    septemberGames(){

      var fechas = [];

      var partidosAux = [];

      var aux = false

      var auxCounter= 0;

      for(let i in this.matches){
        if(this.matches[i].monthN=="8"){
          if (this.matches[i].location.name == this.scheduleFilterL || this.scheduleFilterL=="All") {

            if (this.matches[i].team1.team_name == this.scheduleFilterT || this.matches[i].team2.team_name==this.scheduleFilterT || this.scheduleFilterT=="All") {

              auxCounter++

              if (!aux) {
                var loopCurrDate = new Date("2019",this.matches[i].monthN,this.matches[i].day);
                aux = true
              }

              var dateCheck = new Date("2019",this.matches[i].monthN,this.matches[i].day);

              if (loopCurrDate-dateCheck==0) {
                partidosAux.push(this.matches[i]);
              }else{
                fechas.push(partidosAux);
                partidosAux = [];
                partidosAux.push(this.matches[i]);
                loopCurrDate = dateCheck;
              }

            }

          }


        }

      }

      fechas.push(partidosAux)

      if (auxCounter==0) {
        fechas = null
      }

      return fechas;

    },

    octoberGames(){
      var fechas = [];

      var partidosAux = [];

      var aux = false

      var auxCounter=0

      for(let i in this.matches){
        if(this.matches[i].monthN=="9"){

          if (this.matches[i].location.name == this.scheduleFilterL || this.scheduleFilterL=="All") {

            if (this.matches[i].team1.team_name == this.scheduleFilterT || this.matches[i].team2.team_name==this.scheduleFilterT || this.scheduleFilterT=="All") {


              if (!aux) {
                var loopCurrDate = new Date("2019",this.matches[i].monthN,this.matches[i].day);
                aux = true
              }
              var dateCheck = new Date("2019",this.matches[i].monthN,this.matches[i].day);

              if (loopCurrDate-dateCheck==0) {
                partidosAux.push(this.matches[i]);
              }else{
                fechas.push(partidosAux);
                partidosAux = [];
                partidosAux.push(this.matches[i]);
                loopCurrDate = dateCheck;
              }


              auxCounter++
            }

          }
        }
      }

      fechas.push(partidosAux)

      if (auxCounter==0) {
        fechas = null
      }

      return fechas;
    }
  }
})