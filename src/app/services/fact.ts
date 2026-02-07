import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, repeat } from 'rxjs';
import { IFact } from '../helpers/interfaces';
import { API_BASE_URL } from '../helpers/globals';

interface FactResponse {
  data: IFact[];
}

@Injectable({
  providedIn: 'root',
})
export class FactService {
  constructor(private http: HttpClient) {}

  getRandomFact() {
    return this.http.get<FactResponse>(`${API_BASE_URL}/facts?limit=1`).pipe(
      map((response) => response.data[0].attributes.body),
      repeat({ delay: 30_000 }),
    );
  }
}
