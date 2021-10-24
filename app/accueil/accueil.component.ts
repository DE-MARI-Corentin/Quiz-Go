import { Component, OnInit } from '@angular/core';

import { AuthentificationService } from '../services/authentification.service';
import { AlertService } from '../services/alert.service';

@Component({
  selector: 'app-accueil',
  templateUrl: './accueil.component.html',
  styleUrls: ['./accueil.component.css']
})
export class AccueilComponent implements OnInit {
	user:any;

  constructor(public auth : AuthentificationService,
  	public alertService: AlertService) {
  	  this.user = JSON.parse(localStorage.getItem('user'));
		  this.alertService.clear();
      this.isLogged();

  	 }

  ngOnInit(): void {

  }

  isLogged()
  {
  	if (this.auth.IsLogged() == true)
	{
	 this.alertService.success("Vous êtes connecté, Bonjour : "+this.user.usr,{keepAfterRouteChange: true})
  }
  else
  {
  	this.alertService.warn("Vous n'êtes pas connecté, retry !",{keepAfterRouteChange: true})
  }
}

}
