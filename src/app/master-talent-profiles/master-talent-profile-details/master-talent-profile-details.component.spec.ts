import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { MasterTalentProfileDetailsComponent } from './master-talent-profile-details.component';

describe('MasterTalentProfileDetailsComponent', () => {
  let component: MasterTalentProfileDetailsComponent;
  let fixture: ComponentFixture<MasterTalentProfileDetailsComponent>;
  CommonTestingModule.setUpTestBed(MasterTalentProfileDetailsComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MasterTalentProfileDetailsComponent ],
      providers:[NgbActiveModal]

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterTalentProfileDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
