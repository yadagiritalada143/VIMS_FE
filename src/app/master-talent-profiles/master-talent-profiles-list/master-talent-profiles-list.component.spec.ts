import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { MasterTalentProfilesListComponent } from './master-talent-profiles-list.component';

describe('MasterTalentProfilesListComponent', () => {
  let component: MasterTalentProfilesListComponent;
  let fixture: ComponentFixture<MasterTalentProfilesListComponent>;
  CommonTestingModule.setUpTestBed(MasterTalentProfilesListComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MasterTalentProfilesListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterTalentProfilesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
