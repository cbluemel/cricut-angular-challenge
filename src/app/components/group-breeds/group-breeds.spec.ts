import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupBreeds } from './group-breeds';
import { provideRouter } from '@angular/router';

describe('GroupBreeds', () => {
  let component: GroupBreeds;
  let fixture: ComponentFixture<GroupBreeds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupBreeds],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupBreeds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
