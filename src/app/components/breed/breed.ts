import { Component, inject, OnInit } from '@angular/core';
import { BreedService } from '../../services/breed';
import { Observable } from 'rxjs';
import { IBreed } from '../../helpers/interfaces';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-breed',
  imports: [CommonModule, MatIconModule],
  templateUrl: './breed.html',
  styleUrl: './breed.scss',
})
export class Breed implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private breedService = inject(BreedService);

  breed$?: Observable<IBreed>;

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const breedId = params['id'];
      this.breed$ = this.breedService.getBreedById(breedId);
    });
  }
}
