import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { BreedService } from '../../services/breed';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { IBreed, IProgress } from '../../helpers/interfaces';

@Component({
  selector: 'app-group-breeds',
  imports: [CommonModule, MatProgressBarModule, RouterLink],
  templateUrl: './group-breeds.html',
  styleUrl: './group-breeds.scss',
})
export class GroupBreeds implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private breedService = inject(BreedService);

  breeds$?: Observable<IBreed[] | undefined>;
  progress$?: Observable<IProgress>;

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const groupId = params['id'];
      this.breeds$ = this.breedService.getBreedsByGroup(groupId);
      this.progress$ = this.breedService.getBreedsProgress(groupId);
    });
  }
}
