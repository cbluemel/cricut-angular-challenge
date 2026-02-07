import { CommonModule } from '@angular/common';
import { FactService } from './services/fact';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, MatCardModule, CommonModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  factService = inject(FactService);
  randomFact$ = this.factService.getRandomFact();
}
