import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { MasterProfileLinkingComponent } from './master-profile-linking.component';

describe('MasterProfileLinkingComponent', () => {
  let component: MasterProfileLinkingComponent;
  let fixture: ComponentFixture<MasterProfileLinkingComponent>;
  CommonTestingModule.setUpTestBed(MasterProfileLinkingComponent);
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MasterProfileLinkingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MasterProfileLinkingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
