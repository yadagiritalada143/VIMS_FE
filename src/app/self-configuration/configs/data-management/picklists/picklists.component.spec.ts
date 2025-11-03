import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PicklistsComponent } from './picklists.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('PicklistsComponent', () => {
  let component: PicklistsComponent;
  let fixture: ComponentFixture<PicklistsComponent>;
  CommonTestingModule.setUpTestBed(PicklistsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PicklistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
