import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Breed } from './breed';

describe('Breed', () => {
  let component: Breed;
  let fixture: ComponentFixture<Breed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Breed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Breed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
