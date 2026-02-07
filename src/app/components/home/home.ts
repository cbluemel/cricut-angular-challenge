import { Component, inject } from '@angular/core';
import { BreedService } from '../../services/breed';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  breedService = inject(BreedService);
}
