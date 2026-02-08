import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { API_BASE_URL } from '../helpers/globals';
import { IBreed, IGroup, IProgress } from '../helpers/interfaces';
import { BreedService } from './breed';
import { provideHttpClient } from '@angular/common/http';

describe('BreedService', () => {
  let service: BreedService;
  let httpMock: HttpTestingController;

  const makeGroup = (id: string, breedIds: string[]): IGroup => ({
    id,
    type: 'group',
    attributes: { name: `Group ${id}` },
    relationships: {
      breeds: {
        data: breedIds.map((breedId) => ({ id: breedId, type: 'breed' })),
      },
    },
  });

  const makeBreed = (id: string): IBreed => ({
    id,
    type: 'breed',
    attributes: {
      name: `Breed ${id}`,
      description: `Desc ${id}`,
      hypoallergenic: false,
      life: { min: 1, max: 2 },
      male_weight: { min: 10, max: 20 },
      female_weight: { min: 8, max: 18 },
    },
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BreedService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(BreedService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  describe('getGroups', () => {
    it('should fetch groups once and then cache them', () => {
      const emissionsA: (IGroup[] | undefined)[] = [];
      const emissionsB: (IGroup[] | undefined)[] = [];

      service.getGroups().subscribe((g) => emissionsA.push(g));
      service.getGroups().subscribe((g) => emissionsB.push(g));

      const req = httpMock.expectOne(`${API_BASE_URL}/groups`);
      expect(req.request.method).toBe('GET');

      const groups = [makeGroup('g1', ['b1'])];
      req.flush({ data: groups });

      expect(emissionsA[0]).toBeUndefined();
      expect(emissionsB[0]).toBeUndefined();
      expect(emissionsA[emissionsA.length - 1]).toEqual(groups);
      expect(emissionsB[emissionsB.length - 1]).toEqual(groups);

      service.getGroups().subscribe();
      httpMock.expectNone(`${API_BASE_URL}/groups`);
    });

    it('should set groups to [] on error and stop requesting', () => {
      const emissions: (IGroup[] | undefined)[] = [];
      vi.spyOn(console, 'error').mockImplementation(() => {});

      service.getGroups().subscribe((g) => emissions.push(g));

      const req = httpMock.expectOne(`${API_BASE_URL}/groups`);
      req.flush('nope', { status: 500, statusText: 'Server Error' });

      expect(console.error).toHaveBeenCalled();
      expect(emissions[0]).toBeUndefined();
      expect(emissions[emissions.length - 1]).toEqual([]);

      service.getGroups().subscribe();
      httpMock.expectNone(`${API_BASE_URL}/groups`);
    });
  });

  describe('getBreedsByGroup', () => {
    it('should early-exit and not hit HTTP when groupId is falsy', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const emitted: (IBreed[] | undefined)[] = [];
      service.getBreedsByGroup('').subscribe((b) => emitted.push(b));

      expect(console.warn).toHaveBeenCalledWith('Group ID is required to fetch breeds.');
      expect(emitted).toEqual([undefined]);

      httpMock.expectNone(`${API_BASE_URL}/groups`);
      httpMock.expectNone((r) => r.url.startsWith(`${API_BASE_URL}/breeds/`));
    });

    it('should warn and do nothing if groupId does not exist', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const emitted: (IBreed[] | undefined)[] = [];
      service.getBreedsByGroup('missing').subscribe((b) => emitted.push(b));

      const req = httpMock.expectOne(`${API_BASE_URL}/groups`);
      req.flush({ data: [makeGroup('g1', ['b1'])] });

      expect(console.warn).toHaveBeenCalledWith('Group with ID missing not found.');

      httpMock.expectNone((r) => r.url.startsWith(`${API_BASE_URL}/breeds/`));

      expect(emitted).toEqual([undefined]);
    });

    it('should emit cached breeds immediately and update progress, then fetch missing breeds incrementally', () => {
      const groupId = 'g1';

      const cachedBreed = makeBreed('b1');
      service.getBreedById('b1').subscribe();
      const preReq = httpMock.expectOne(`${API_BASE_URL}/breeds/b1`);
      preReq.flush({ data: cachedBreed });

      const group = makeGroup(groupId, ['b1', 'b2', 'b3']);

      const breedsEmitted: (IBreed[] | undefined)[] = [];
      const progressEmitted: IProgress[] = [];

      service.getBreedsByGroup(groupId).subscribe((b) => breedsEmitted.push(b));
      service.getBreedsProgress(groupId).subscribe((p) => progressEmitted.push(p));

      const groupsReq = httpMock.expectOne(`${API_BASE_URL}/groups`);
      groupsReq.flush({ data: [group] });

      expect(breedsEmitted[0]).toBeUndefined();
      expect(breedsEmitted[1]).toEqual([cachedBreed]);

      expect(progressEmitted[0]).toEqual({ done: 0, total: 0 });
      expect(progressEmitted[1]).toEqual({ done: 1, total: 3 });

      const breedReqs = httpMock.match(
        (r) => r.method === 'GET' && r.url.startsWith(`${API_BASE_URL}/breeds/`),
      );
      const urls = breedReqs.map((r) => r.request.url).sort();
      expect(urls).toEqual([`${API_BASE_URL}/breeds/b2`, `${API_BASE_URL}/breeds/b3`].sort());

      const b3 = makeBreed('b3');
      const b2 = makeBreed('b2');

      const reqB3 = breedReqs.find((r) => r.request.url.endsWith('/b3'))!;
      reqB3.flush({ data: b3 });

      const reqB2 = breedReqs.find((r) => r.request.url.endsWith('/b2'))!;
      reqB2.flush({ data: b2 });

      const finalBreeds = breedsEmitted[breedsEmitted.length - 1]!;
      expect(finalBreeds.length).toBe(3);
      expect(finalBreeds.map((b) => b.id).sort()).toEqual(['b1', 'b2', 'b3']);

      const finalProgress = progressEmitted[progressEmitted.length - 1];
      expect(finalProgress).toEqual({ done: 3, total: 3 });
    });

    it('should not start duplicate requests when called again while in-flight', () => {
      const groupId = 'g1';
      const group = makeGroup(groupId, ['b1', 'b2']);

      const emissionsA: (IBreed[] | undefined)[] = [];
      const emissionsB: (IBreed[] | undefined)[] = [];

      service.getBreedsByGroup(groupId).subscribe((b) => emissionsA.push(b));
      service.getBreedsByGroup(groupId).subscribe((b) => emissionsB.push(b));

      const groupsReq = httpMock.expectOne(`${API_BASE_URL}/groups`);
      groupsReq.flush({ data: [group] });

      const breedReqs = httpMock.match(
        (r) => r.method === 'GET' && r.url.startsWith(`${API_BASE_URL}/breeds/`),
      );
      expect(breedReqs.length).toBe(2);

      breedReqs.find((r) => r.request.url.endsWith('/b1'))!.flush({ data: makeBreed('b1') });
      breedReqs.find((r) => r.request.url.endsWith('/b2'))!.flush({ data: makeBreed('b2') });

      const lastA = emissionsA[emissionsA.length - 1]!;
      const lastB = emissionsB[emissionsB.length - 1]!;
      expect(lastA.map((b) => b.id).sort()).toEqual(['b1', 'b2']);
      expect(lastB.map((b) => b.id).sort()).toEqual(['b1', 'b2']);
    });

    it('should return cached group breeds without hitting HTTP again', () => {
      const groupId = 'g1';
      const group = makeGroup(groupId, ['b1']);

      const firstEmissions: (IBreed[] | undefined)[] = [];
      service.getBreedsByGroup(groupId).subscribe((b) => firstEmissions.push(b));

      const groupsReq = httpMock.expectOne(`${API_BASE_URL}/groups`);
      groupsReq.flush({ data: [group] });

      const breedReq = httpMock.expectOne(`${API_BASE_URL}/breeds/b1`);
      const breed = makeBreed('b1');
      breedReq.flush({ data: breed });

      const secondEmissions: (IBreed[] | undefined)[] = [];
      service.getBreedsByGroup(groupId).subscribe((b) => secondEmissions.push(b));

      httpMock.expectNone(`${API_BASE_URL}/groups`);
      httpMock.expectNone(`${API_BASE_URL}/breeds/b1`);

      expect(secondEmissions[0]).toEqual([breed]);
    });
  });

  describe('getBreedById', () => {
    it('should fetch and cache breed by id, then serve from cache on subsequent calls', () => {
      const breed = makeBreed('b99');

      const emissionsA: IBreed[] = [];
      service.getBreedById('b99').subscribe((b) => emissionsA.push(b));

      const req = httpMock.expectOne(`${API_BASE_URL}/breeds/b99`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: breed });

      expect(emissionsA).toEqual([breed]);

      const emissionsB: IBreed[] = [];
      service.getBreedById('b99').subscribe((b) => emissionsB.push(b));

      httpMock.expectNone(`${API_BASE_URL}/breeds/b99`);
      expect(emissionsB).toEqual([breed]);
    });
  });
});
