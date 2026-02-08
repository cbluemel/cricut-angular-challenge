import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Breed } from './breed';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('Breed', () => {
  let component: Breed;
  let fixture: ComponentFixture<Breed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breed],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Breed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
