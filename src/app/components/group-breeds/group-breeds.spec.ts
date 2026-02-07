import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupBreeds } from './group-breeds';

describe('GroupBreeds', () => {
  let component: GroupBreeds;
  let fixture: ComponentFixture<GroupBreeds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupBreeds]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupBreeds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
