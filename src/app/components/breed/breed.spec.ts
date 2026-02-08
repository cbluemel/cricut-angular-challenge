import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';

import { Breed } from './breed';
import { BreedService } from '../../services/breed';
import { IBreed } from '../../helpers/interfaces';

describe('Breed component', () => {
  let fixture: ComponentFixture<Breed>;
  let breedService: BreedService;

  const routeParams$ = new BehaviorSubject<{ id: string }>({ id: 'b1' });

  const makeBreed = (overrides?: Partial<IBreed>): IBreed => ({
    id: 'b1',
    type: 'breed',
    attributes: {
      name: 'Test Breed',
      description: 'Test description',
      hypoallergenic: false,
      life: { min: 10, max: 12 },
      male_weight: { min: 20, max: 30 },
      female_weight: { min: 18, max: 28 },
    },
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breed],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable(),
          },
        },
        {
          provide: BreedService,
          useValue: {
            getBreedById: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Breed);
    breedService = TestBed.inject(BreedService);
  });

  it('should request breed by id from route params', async () => {
    const breed = makeBreed();
    (breedService.getBreedById as any).mockReturnValue(of(breed));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(breedService.getBreedById).toHaveBeenCalledWith('b1');
  });

  it('should render breed details when breed$ emits', async () => {
    const breed = makeBreed({
      attributes: {
        ...makeBreed().attributes,
        hypoallergenic: true,
      },
    });

    (breedService.getBreedById as any).mockReturnValue(of(breed));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h2')?.textContent).toContain('Test Breed');
    expect(compiled.textContent).toContain('Test description');
    expect(compiled.textContent).toContain('Hypoallergenic');
    expect(compiled.textContent).toContain('Life Span: 10 years - 12 years');
  });

  it('should render combined weight when male and female weights match', async () => {
    const breed = makeBreed({
      attributes: {
        ...makeBreed().attributes,
        male_weight: { min: 20, max: 30 },
        female_weight: { min: 20, max: 30 },
      },
    });

    (breedService.getBreedById as any).mockReturnValue(of(breed));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('20kg - 30kg');
    expect(compiled.textContent).not.toContain('Male:');
  });

  it('should render separate male/female weights when they differ', async () => {
    const breed = makeBreed();

    (breedService.getBreedById as any).mockReturnValue(of(breed));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Male: 20kg - 30kg');
    expect(compiled.textContent).toContain('Female: 18kg - 28kg');
  });

  it('should show loading state before breed emits', async () => {
    (breedService.getBreedById as any).mockReturnValue(of());

    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Loading...');
  });
});
