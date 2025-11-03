import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { NoOrganizationComponent } from './no-organization.component';

describe('NoOrganizationComponent', () => {
  let component: NoOrganizationComponent;
  let fixture: ComponentFixture<NoOrganizationComponent>;
  CommonTestingModule.setUpTestBed(NoOrganizationComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NoOrganizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
