import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasterTalentProfilesComponent } from './master-talent-profiles.component';

describe('MasterTalentProfilesComponent', () => {
  let component: MasterTalentProfilesComponent;
  let fixture: ComponentFixture<MasterTalentProfilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MasterTalentProfilesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterTalentProfilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
