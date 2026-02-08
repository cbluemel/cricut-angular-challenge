import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  EMPTY,
  filter,
  finalize,
  from,
  map,
  mergeMap,
  Observable,
  of,
  scan,
  switchMap,
  take,
  tap,
} from 'rxjs';

import { API_BASE_URL } from '../helpers/globals';
import { IBreed, IGroup, IProgress } from './../helpers/interfaces';

interface IGroupResponse {
  data: IGroup[];
}

interface IBreedResponse {
  data: IBreed;
}

@Injectable({
  providedIn: 'root',
})
export class BreedService {
  private groups$$ = new BehaviorSubject<IGroup[] | undefined>(undefined);
  private isRequestingGroups = false;
  private breedsByGroup$$ = new Map<string, BehaviorSubject<IBreed[] | undefined>>();
  private isRequestingGroupBreeds = new Set<string>();
  private progressByGroup$$ = new Map<string, BehaviorSubject<IProgress>>();
  private breedsById = new Map<string, IBreed>();

  constructor(private http: HttpClient) {}

  private getBreedsSubject(groupId: string) {
    let subj = this.breedsByGroup$$.get(groupId);
    if (!subj) {
      subj = new BehaviorSubject<IBreed[] | undefined>(undefined);
      this.breedsByGroup$$.set(groupId, subj);
    }
    return subj;
  }

  private getProgressSubject(groupId: string) {
    let subj = this.progressByGroup$$.get(groupId);
    if (!subj) {
      subj = new BehaviorSubject<IProgress>({ done: 0, total: 0 });
      this.progressByGroup$$.set(groupId, subj);
    }
    return subj;
  }

  private fetchBreedsIncrementally(
    cachedBreeds: IBreed[],
    missingBreedIds: string[],
    total: number,
  ) {
    return from(missingBreedIds).pipe(
      mergeMap(
        (id) =>
          this.http
            .get<IBreedResponse>(`${API_BASE_URL}/breeds/${id}`)
            .pipe(map((response) => response.data)),
        10,
      ),
      scan(
        (state, breed) => {
          this.breedsById.set(breed.id, breed);
          const breeds = [...state.breeds, breed];
          const done = state.done + 1;
          return { breeds, done, total: state.total };
        },
        { breeds: cachedBreeds, done: cachedBreeds.length, total },
      ),
    );
  }

  getGroups() {
    if (!this.isRequestingGroups && !this.groups$$.value) {
      this.isRequestingGroups = true;

      this.http
        .get<IGroupResponse>(`${API_BASE_URL}/groups`)
        .pipe(
          finalize(() => {
            this.isRequestingGroups = false;
          }),
        )
        .subscribe({
          error: (error) => {
            console.error('Error fetching groups:', error);
            this.groups$$.next([]);
          },
          next: (response) => {
            this.groups$$.next(response.data);
          },
        });
    }

    return this.groups$$.asObservable();
  }

  getBreedsByGroup(groupId: string) {
    if (!groupId) {
      console.warn('Group ID is required to fetch breeds.');
      return of(undefined);
    }

    const groupBreeds$$ = this.getBreedsSubject(groupId);
    if (groupBreeds$$.value) {
      return groupBreeds$$.asObservable();
    }

    if (this.isRequestingGroupBreeds.has(groupId)) {
      return groupBreeds$$.asObservable();
    }

    this.isRequestingGroupBreeds.add(groupId);

    const breedsProgress$$ = this.getProgressSubject(groupId);
    this.getGroups()
      .pipe(
        filter((groups) => !!groups),
        take(1),
        switchMap((groups) => {
          const group = groups.find((g) => g.id === groupId);

          if (!group) {
            console.warn(`Group with ID ${groupId} not found.`);
            return EMPTY;
          }

          const breeds = group.relationships.breeds.data;
          const total = breeds.length;
          const cachedBreeds: IBreed[] = [];
          const missingBreeds: string[] = [];

          breeds.forEach((breed) => {
            const cached = this.breedsById.get(breed.id);
            if (cached) cachedBreeds.push(cached);
            else missingBreeds.push(breed.id);
          });

          breedsProgress$$.next({ done: cachedBreeds.length, total });
          groupBreeds$$.next(cachedBreeds);

          if (missingBreeds.length === 0) {
            return EMPTY;
          }

          return this.fetchBreedsIncrementally(cachedBreeds, missingBreeds, total);
        }),
        finalize(() => {
          this.isRequestingGroupBreeds.delete(groupId);
        }),
      )
      .subscribe({
        error: (error) => {
          console.error('Error fetching breeds:', error);
        },
        next: (state) => {
          groupBreeds$$.next(state.breeds);
          breedsProgress$$.next({ done: state.done, total: state.total });
        },
      });

    return groupBreeds$$.asObservable();
  }

  getBreedsProgress(groupId: string) {
    return this.getProgressSubject(groupId).asObservable();
  }

  getBreedById(breedId: string): Observable<IBreed> {
    const cachedBreed = this.breedsById.get(breedId);
    if (cachedBreed) {
      return of(cachedBreed);
    }

    return this.http.get<IBreedResponse>(`${API_BASE_URL}/breeds/${breedId}`).pipe(
      map((r) => r.data),
      tap((breed) => {
        this.breedsById.set(breed.id, breed);
      }),
    );
  }
}
